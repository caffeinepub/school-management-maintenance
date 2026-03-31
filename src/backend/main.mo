import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Extend actor with migration capability

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type AppRole = { #teacher; #authority; #admin };

  let appRoles = Map.empty<Principal, AppRole>();

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  type Category = {
    #Maintenance;
    #LabEquipment;
    #Stationery;
    #ITEquipment;
    #Other;
  };

  type Priority = {
    #Low;
    #Medium;
    #High;
    #Urgent;
  };

  type Status = {
    #Pending;
    #Approved;
    #Rejected;
    #Seen;
    #Completed;
    #UnableToFulfill;
  };

  type Request = {
    id : Nat;
    title : Text;
    category : Category;
    description : Text;
    priority : Priority;
    location : Text;
    quantity : ?Nat;
    expectedDate : Text;
    submittedBy : Principal;
    submittedByName : Text;
    submittedAt : Int;
    status : Status;
    reviewedBy : ?Principal;
    reviewRemarks : ?Text;
    reviewedAt : ?Int;
    completedAt : ?Int;
    adminActionAt : ?Int;
    adminActionNote : ?Text;
  };

  module Request {
    public func compare(a : Request, b : Request) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type SubmitRequestInput = {
    title : Text;
    categoryText : Text;
    description : Text;
    priorityText : Text;
    location : Text;
    quantity : ?Nat;
    expectedDate : Text;
    submitterName : Text;
  };

  type RequestStats = {
    total : Nat;
    pending : Nat;
    approved : Nat;
    seen : Nat;
    completed : Nat;
    unableToFulfill : Nat;
    rejected : Nat;
  };

  let requests = Map.empty<Nat, Request>();
  var nextRequestId = 0;

  // Helper function to get app role of a user
  func getAppRole(p : Principal) : ?AppRole {
    appRoles.get(p);
  };

  // Helper function to check if a user is a teacher
  func isTeacher(p : Principal) : Bool {
    switch (getAppRole(p)) {
      case (?#teacher) { true };
      case (_) { false };
    };
  };

  // Helper function to check if a user is an authority
  func isAuthority(p : Principal) : Bool {
    switch (getAppRole(p)) {
      case (?#authority) { true };
      case (_) { false };
    };
  };

  // Helper function to check if a user is an admin
  func isAppAdmin(p : Principal) : Bool {
    switch (getAppRole(p)) {
      case (?#admin) { true };
      case (_) { false };
    };
  };

  // Helper function to parse category text
  func parseCategory(text : Text) : Category {
    switch (text) {
      case ("Maintenance") { #Maintenance };
      case ("LabEquipment") { #LabEquipment };
      case ("Stationery") { #Stationery };
      case ("ITEquipment") { #ITEquipment };
      case ("Other") { #Other };
      case (_) { Runtime.trap("Invalid category: " # text) };
    };
  };

  // Helper function to parse priority text
  func parsePriority(text : Text) : Priority {
    switch (text) {
      case ("Low") { #Low };
      case ("Medium") { #Medium };
      case ("High") { #High };
      case ("Urgent") { #Urgent };
      case (_) { Runtime.trap("Invalid priority: " # text) };
    };
  };

  // Any authenticated (non-anonymous) user can read/write their own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Auto-registers new users in the access control system when they save their profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };

    // Auto-register as user in access control if not already registered
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { accessControlState.userRoles.add(caller, #user) };
      case (?_) {};
    };

    let appRole : AppRole = switch (profile.role) {
      case ("teacher") { #teacher };
      case ("authority") { #authority };
      case ("admin") { #admin };
      case (_) { Runtime.trap("Invalid role: must be teacher, authority, or admin") };
    };

    appRoles.add(caller, appRole);
    userProfiles.add(caller, profile);
  };

  // Returns all user profiles. Only callable by the Caffeine admin.
  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.toArray();
  };

  // Create or overwrite a user profile. Only callable by the Caffeine admin.
  public shared ({ caller }) func setUserProfileForPrincipal(user : Principal, profile : UserProfile) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };

    // Save profile for any principal
    userProfiles.add(user, profile);

    // Auto-register principal in Caffeine Access Control as user (if not already)
    switch (accessControlState.userRoles.get(user)) {
      case (null) { accessControlState.userRoles.add(user, #user) };
      case (?_) {};
    };

    // Add to app roles regardless (app-level role, not Caffeine access control)
    let appRole : AppRole = switch (profile.role) {
      case ("teacher") { #teacher };
      case ("authority") { #authority };
      case ("admin") { #admin };
      case (_) { Runtime.trap("Invalid role: must be teacher, authority, or admin") };
    };
    appRoles.add(user, appRole);
  };

  public shared ({ caller }) func submitRequest(input : SubmitRequestInput) : async Nat {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isTeacher(caller)) { Runtime.trap("Unauthorized: Only teachers can submit requests") };

    let requestId = nextRequestId;
    nextRequestId += 1;

    requests.add(
      requestId,
      {
        id = requestId;
        title = input.title;
        category = parseCategory(input.categoryText);
        description = input.description;
        priority = parsePriority(input.priorityText);
        location = input.location;
        quantity = input.quantity;
        expectedDate = input.expectedDate;
        submittedBy = caller;
        submittedByName = input.submitterName;
        submittedAt = Time.now();
        status = #Pending;
        reviewedBy = null;
        reviewRemarks = null;
        reviewedAt = null;
        completedAt = null;
        adminActionAt = null;
        adminActionNote = null;
      },
    );
    requestId;
  };

  public query ({ caller }) func getMyRequests() : async [Request] {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isTeacher(caller)) { Runtime.trap("Unauthorized: Only teachers can view their requests") };
    requests.values().toArray().filter(func(r) { r.submittedBy == caller }).sort();
  };

  public query ({ caller }) func getAllPendingRequests() : async [Request] {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isAuthority(caller)) { Runtime.trap("Unauthorized: Only authorities can view pending requests") };
    requests.values().toArray().filter(func(r) { switch (r.status) { case (#Pending) { true }; case (_) { false } } }).sort();
  };

  public query ({ caller }) func getAllApprovedRequests() : async [Request] {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isAppAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can view approved requests") };
    requests.values().toArray().filter(
      func(r) {
        switch (r.status) {
          case (#Approved) { true };
          case (#Seen) { true };
          case (#UnableToFulfill) { true };
          case (_) { false };
        };
      }
    ).sort();
  };

  public query ({ caller }) func getAllRequests() : async [Request] {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not (isAuthority(caller) or isAppAdmin(caller))) {
      Runtime.trap("Unauthorized: Only authorities and admins can view all requests");
    };
    requests.values().toArray().sort();
  };

  public query ({ caller }) func getRequest(requestId : Nat) : async Request {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    
    switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request " # requestId.toText() # " does not exist") };
      case (?r) {
        // Teachers can only view their own requests
        if (isTeacher(caller) and r.submittedBy != caller) {
          Runtime.trap("Unauthorized: Teachers can only view their own requests");
        };
        // Authorities and admins can view any request
        if (not (isTeacher(caller) or isAuthority(caller) or isAppAdmin(caller))) {
          Runtime.trap("Unauthorized: Must have a valid app role");
        };
        r;
      };
    };
  };

  public shared ({ caller }) func approveRequest(requestId : Nat, remarks : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isAuthority(caller)) { Runtime.trap("Unauthorized: Only authorities can approve requests") };
    
    let r = switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?r) { r };
    };
    
    if (r.status != #Pending) { Runtime.trap("Request is not Pending") };
    
    requests.add(
      requestId,
      {
        r with
        status = #Approved;
        reviewedBy = ?caller;
        reviewRemarks = ?remarks;
        reviewedAt = ?Time.now();
      },
    );
  };

  public shared ({ caller }) func rejectRequest(requestId : Nat, remarks : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isAuthority(caller)) { Runtime.trap("Unauthorized: Only authorities can reject requests") };
    
    let r = switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?r) { r };
    };
    
    if (r.status != #Pending) { Runtime.trap("Request is not Pending") };
    
    requests.add(
      requestId,
      {
        r with
        status = #Rejected;
        reviewedBy = ?caller;
        reviewRemarks = ?remarks;
        reviewedAt = ?Time.now();
      },
    );
  };

  public shared ({ caller }) func markSeen(requestId : Nat) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isAppAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can mark seen") };
    
    let r = switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?r) { r };
    };
    
    switch (r.status) {
      case (#Approved) {};
      case (_) { Runtime.trap("Request is not Approved") };
    };
    
    requests.add(
      requestId,
      {
        r with
        status = #Seen;
        adminActionAt = ?Time.now();
        adminActionNote = ?("Marked as seen");
      },
    );
  };

  public shared ({ caller }) func markCompleted(requestId : Nat) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isAppAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can mark completed") };
    
    let r = switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?r) { r };
    };
    
    switch (r.status) {
      case (#Approved) {};
      case (#Seen) {};
      case (_) { Runtime.trap("Request must be Approved or Seen") };
    };
    
    requests.add(
      requestId,
      {
        r with
        status = #Completed;
        completedAt = ?Time.now();
        adminActionAt = ?Time.now();
        adminActionNote = ?("Marked as completed");
      },
    );
  };

  public shared ({ caller }) func markUnableToFulfill(requestId : Nat, note : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not isAppAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can mark unable to fulfill") };
    
    let r = switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?r) { r };
    };
    
    switch (r.status) {
      case (#Approved) {};
      case (#Seen) {};
      case (_) { Runtime.trap("Request must be Approved or Seen") };
    };
    
    requests.add(
      requestId,
      {
        r with
        status = #UnableToFulfill;
        adminActionAt = ?Time.now();
        adminActionNote = ?note;
      },
    );
  };

  public query ({ caller }) func getStats() : async RequestStats {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (not (isAuthority(caller) or isAppAdmin(caller))) {
      Runtime.trap("Unauthorized: Only authorities and admins can view statistics");
    };
    
    let all = requests.toArray();
    var pending = 0;
    var approved = 0;
    var seen = 0;
    var completed = 0;
    var unableToFulfill = 0;
    var rejected = 0;
    
    for ((_, r) in all.values()) {
      switch (r.status) {
        case (#Pending) { pending += 1 };
        case (#Approved) { approved += 1 };
        case (#Seen) { seen += 1 };
        case (#Completed) { completed += 1 };
        case (#UnableToFulfill) { unableToFulfill += 1 };
        case (#Rejected) { rejected += 1 };
      };
    };
    
    {
      total = all.size();
      pending;
      approved;
      seen;
      completed;
      unableToFulfill;
      rejected;
    };
  };
};

