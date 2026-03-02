import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat32 "mo:core/Nat32";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Migration "migration";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// With migration on upgrades
(with migration = Migration.run)
actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ---- Owner Principal ----
  var owner : ?Principal = null;

  // ---- User Profile ----
  public type UserProfile = {
    name : Text;
    role : Text; // "owner" or "worker"
    workerId : ?Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller) and not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ---- Owner Registration ----
  // Allows the first authenticated caller to claim ownership when no owner is set.
  // After ownership is claimed, this function becomes a no-op for non-owners.
  public shared ({ caller }) func registerOwner() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot register as owner");
    };
    switch (owner) {
      case (null) {
        // No owner set yet — allow this caller to claim ownership
        owner := ?caller;
      };
      case (?existingOwner) {
        if (caller != existingOwner) {
          Runtime.trap("Unauthorized: An owner is already registered");
        };
      };
    };
  };

  // ---- Owner Validation ----
  func isOwnerPrincipal(caller : Principal) : Bool {
    switch (owner) {
      case (?principal) { caller == principal };
      case (null) { false };
    };
  };

  // ---- Helper: get workerId linked to caller ----
  func getCallerWorkerId(caller : Principal) : ?Text {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.workerId };
      case (null) { null };
    };
  };

  // ---- Types ----
  type WorkerId = Text;
  type AttendanceId = Text;
  type ConfirmationId = Text;
  type NoteId = Text;
  type SalaryId = Text;
  type AnnouncementId = Text;
  type HolidayId = Text;

  type Worker = {
    workerId : WorkerId;
    name : Text;
    mobile : Text;
    monthlySalary : Nat;
    pin : Text;
    active : Bool;
  };

  type AttendanceRecord = {
    recordId : AttendanceId;
    workerId : WorkerId;
    date : Text;
    status : AttendanceStatus;
    markedBy : Text;
    timestamp : Time.Time;
    latitude : ?Float;
    longitude : ?Float;
    photo : ?Storage.ExternalBlob;
  };

  type AttendanceStatus = {
    #present;
    #absent;
    #leave;
    #holiday;
  };

  type TwoPMConfirmation = {
    confirmationId : ConfirmationId;
    workerId : WorkerId;
    date : Text;
    confirmedAt : ?Time.Time;
    confirmed : Bool;
  };

  type Note = {
    noteId : NoteId;
    workerId : WorkerId;
    noteType : NoteType;
    content : Text;
    photoUrl : ?Storage.ExternalBlob;
    createdBy : Text;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
  };

  type NoteType = {
    #work;
    #material;
    #ownerInstruction;
    #perWorker;
  };

  type SalaryRecord = {
    salaryId : SalaryId;
    workerId : WorkerId;
    month : Nat;
    year : Nat;
    monthlySalary : Nat;
    presentDays : Nat;
    absentDays : Nat;
    cutDays : Nat;
    advanceAmount : Nat;
    carryForward : Int;
    companyHolidays : Nat;
    netPay : Int;
    manualOverride : Bool;
  };

  type Announcement = {
    announcementId : AnnouncementId;
    title : Text;
    content : Text;
    createdAt : Time.Time;
  };

  type Holiday = {
    holidayId : HolidayId;
    date : Text;
    name : Text;
    description : ?Text;
    createdAt : Time.Time;
  };

  // ---- Storage ----
  let workers = Map.empty<WorkerId, Worker>();
  let attendanceRecords = Map.empty<AttendanceId, AttendanceRecord>();
  let confirmations = Map.empty<ConfirmationId, TwoPMConfirmation>();
  let notes = Map.empty<NoteId, Note>();
  let salaryRecords = Map.empty<SalaryId, SalaryRecord>();
  let announcements = Map.empty<AnnouncementId, Announcement>();
  let holidays = Map.empty<HolidayId, Holiday>();

  // Worker counter for W001/W002 format
  var workerCounter : Nat = 0;
  var announcementCounter : Nat = 0;
  var holidayCounter : Nat = 0;

  // ---- Worker Management (Owner only) ----

  public shared ({ caller }) func addWorker(name : Text, mobile : Text, monthlySalary : Nat) : async WorkerId {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can add workers");
    };
    workerCounter += 1;
    let paddedNum = if (workerCounter < 10) {
      "00" # Nat32.fromNat(workerCounter).toText();
    } else if (workerCounter < 100) {
      "0" # Nat32.fromNat(workerCounter).toText();
    } else {
      Nat32.fromNat(workerCounter).toText();
    };
    let workerId = "W" # paddedNum;
    let newWorker : Worker = {
      workerId;
      name;
      mobile;
      monthlySalary;
      pin = "0000";
      active = true;
    };
    workers.add(workerId, newWorker);
    workerId;
  };

  public shared ({ caller }) func editWorker(
    workerId : WorkerId,
    name : Text,
    mobile : Text,
    monthlySalary : Nat,
    pin : Text,
    active : Bool,
  ) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can edit workers");
    };
    switch (workers.get(workerId)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?existing) {
        let updated : Worker = {
          workerId = existing.workerId;
          name;
          mobile;
          monthlySalary;
          pin;
          active;
        };
        workers.add(workerId, updated);
      };
    };
  };

  public shared ({ caller }) func updateWorker(
    workerId : WorkerId,
    name : Text,
    mobile : Text,
    monthlySalary : Nat,
    pin : Text,
    active : Bool,
  ) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can update workers");
    };
    switch (workers.get(workerId)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?existing) {
        let updated : Worker = {
          workerId = existing.workerId;
          name;
          mobile;
          monthlySalary;
          pin;
          active;
        };
        workers.add(workerId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteWorker(workerId : WorkerId) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can delete workers");
    };
    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    workers.remove(workerId);
  };

  public query ({ caller }) func getWorker(workerId : WorkerId) : async Worker {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view worker details");
    };
    // Workers can only view their own record; owner can view any
    if (not isOwnerPrincipal(caller)) {
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only view their own record");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
    };
    switch (workers.get(workerId)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?worker) { worker };
    };
  };

  public query ({ caller }) func getAllWorkers() : async [Worker] {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can list all workers");
    };
    workers.values().toArray().sort();
  };

  module Worker {
    public func compare(w1 : Worker, w2 : Worker) : Order.Order {
      Text.compare(w1.workerId, w2.workerId);
    };
  };

  // ---- Attendance Management ----

  // Workers mark their own attendance (time window enforced on frontend, backend enforces one-per-day)
  public shared ({ caller }) func markAttendance(
    workerId : WorkerId,
    status : AttendanceStatus,
    latitude : ?Float,
    longitude : ?Float,
    photo : ?Storage.ExternalBlob,
  ) : async AttendanceId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to mark attendance");
    };
    // Workers can only mark their own attendance; owner can mark for any worker
    if (not isOwnerPrincipal(caller)) {
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only mark their own attendance");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
      // Workers can only mark as present
      switch (status) {
        case (#present) {};
        case (_) {
          Runtime.trap("Unauthorized: Workers can only mark themselves as present");
        };
      };
    };
    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    let today = Time.now().toText();
    switch (findAttendanceByDate(workerId, today)) {
      case (?_existing) {
        Runtime.trap("Attendance already marked for today");
      };
      case (null) {
        let attendanceId = workerId # "-" # today;
        let markedBy = if (isOwnerPrincipal(caller)) { "OWNER" } else { workerId };
        let newRecord : AttendanceRecord = {
          recordId = attendanceId;
          workerId;
          date = today;
          status;
          markedBy;
          timestamp = Time.now();
          latitude;
          longitude;
          photo;
        };
        attendanceRecords.add(attendanceId, newRecord);
        attendanceId;
      };
    };
  };

  // Owner can add attendance for any date/worker
  public shared ({ caller }) func ownerAddAttendance(
    workerId : WorkerId,
    date : Text,
    status : AttendanceStatus,
  ) : async AttendanceId {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can add attendance records");
    };
    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    switch (findAttendanceByDate(workerId, date)) {
      case (?_existing) {
        Runtime.trap("Attendance already exists for this date");
      };
      case (null) {
        let attendanceId = workerId # "-" # date;
        let newRecord : AttendanceRecord = {
          recordId = attendanceId;
          workerId;
          date;
          status;
          markedBy = "OWNER";
          timestamp = Time.now();
          latitude = null;
          longitude = null;
          photo = null;
        };
        attendanceRecords.add(attendanceId, newRecord);
        attendanceId;
      };
    };
  };

  // Owner can edit any attendance record
  public shared ({ caller }) func ownerUpdateAttendance(recordId : AttendanceId, status : AttendanceStatus) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can edit attendance records");
    };
    switch (attendanceRecords.get(recordId)) {
      case (null) { Runtime.trap("Attendance record not found") };
      case (?existing) {
        let updated : AttendanceRecord = {
          recordId = existing.recordId;
          workerId = existing.workerId;
          date = existing.date;
          status;
          markedBy = "OWNER";
          timestamp = existing.timestamp;
          latitude = existing.latitude;
          longitude = existing.longitude;
          photo = existing.photo;
        };
        attendanceRecords.add(recordId, updated);
      };
    };
  };

  // Owner can delete any attendance record
  public shared ({ caller }) func ownerDeleteAttendance(recordId : AttendanceId) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can delete attendance records");
    };
    if (not attendanceRecords.containsKey(recordId)) {
      Runtime.trap("Attendance record not found");
    };
    attendanceRecords.remove(recordId);
  };

  public query ({ caller }) func getAttendanceByDate(workerId : WorkerId, date : Text) : async ?AttendanceRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view attendance");
    };
    if (not isOwnerPrincipal(caller)) {
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only view their own attendance");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
    };
    findAttendanceByDate(workerId, date);
  };

  public query ({ caller }) func getAttendanceByWorker(workerId : WorkerId) : async [AttendanceRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view attendance");
    };
    if (not isOwnerPrincipal(caller)) {
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only view their own attendance");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
    };
    attendanceRecords.values().toList<AttendanceRecord>().filter(
      func(record : AttendanceRecord) : Bool {
        record.workerId == workerId
      }
    ).toArray().sort();
  };

  module AttendanceRecord {
    public func compare(a1 : AttendanceRecord, a2 : AttendanceRecord) : Order.Order {
      Text.compare(a1.recordId, a2.recordId);
    };
  };

  // Internal helper (not exposed as query)
  func findAttendanceByDate(workerId : WorkerId, date : Text) : ?AttendanceRecord {
    for ((k, v) in attendanceRecords.entries()) {
      if (v.workerId == workerId and v.date == date) { return ?v };
    };
    null;
  };

  // ---- 2PM Confirmation ----

  // Workers confirm their own 2PM check-in
  public shared ({ caller }) func confirmTwoPM(workerId : WorkerId) : async ConfirmationId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to confirm 2PM");
    };
    if (not isOwnerPrincipal(caller)) {
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only confirm their own 2PM check-in");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
    };
    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    let today = Time.now().toText();
    let confirmationId = workerId # "-" # today;
    let newConfirmation : TwoPMConfirmation = {
      confirmationId;
      workerId;
      date = today;
      confirmedAt = ?Time.now();
      confirmed = true;
    };
    confirmations.add(confirmationId, newConfirmation);
    confirmationId;
  };

  // Owner views all confirmations for a given date
  public query ({ caller }) func getConfirmationsByDate(date : Text) : async [TwoPMConfirmation] {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can view all confirmations");
    };
    confirmations.values().toList<TwoPMConfirmation>().filter(
      func(c : TwoPMConfirmation) : Bool {
        c.date == date;
      }
    ).toArray().sort();
  };

  // Worker views their own confirmation
  public query ({ caller }) func getMyConfirmation(workerId : WorkerId, date : Text) : async ?TwoPMConfirmation {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated");
    };
    if (not isOwnerPrincipal(caller)) {
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only view their own confirmation");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
    };
    confirmations.get(workerId # "-" # date);
  };

  module TwoPMConfirmation {
    public func compare(c1 : TwoPMConfirmation, c2 : TwoPMConfirmation) : Order.Order {
      Text.compare(c1.confirmationId, c2.confirmationId);
    };
  };

  // ---- Notes Management ----

  // Add a note — workers can only add work/material notes for themselves
  public shared ({ caller }) func addNote(
    workerId : WorkerId,
    noteType : NoteType,
    content : Text,
    photoUrl : ?Storage.ExternalBlob,
  ) : async NoteId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to add notes");
    };
    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    if (not isOwnerPrincipal(caller)) {
      // Workers cannot create ownerInstruction or perWorker notes
      switch (noteType) {
        case (#ownerInstruction) {
          Runtime.trap("Unauthorized: Only the owner can add owner instructions");
        };
        case (#perWorker) {
          Runtime.trap("Unauthorized: Only the owner can add per-worker notes");
        };
        case (_) {};
      };
      // Workers can only add notes for themselves
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only add notes for themselves");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
    };
    let noteId = workerId # "-" # Time.now().toText();
    let newNote : Note = {
      noteId;
      workerId;
      noteType;
      content;
      photoUrl;
      createdBy = if (isOwnerPrincipal(caller)) { "OWNER" } else { workerId };
      createdAt = Time.now();
      updatedAt = null;
    };
    notes.add(noteId, newNote);
    noteId;
  };

  // Edit a note — workers can only edit their own work/material notes
  public shared ({ caller }) func updateNote(noteId : NoteId, content : Text, photoUrl : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to edit notes");
    };
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Note not found") };
      case (?existing) {
        if (not isOwnerPrincipal(caller)) {
          // Workers cannot edit ownerInstruction or perWorker notes
          switch (existing.noteType) {
            case (#ownerInstruction) {
              Runtime.trap("Unauthorized: Workers cannot edit owner instructions");
            };
            case (#perWorker) {
              Runtime.trap("Unauthorized: Workers cannot edit per-worker notes");
            };
            case (_) {};
          };
          // Workers can only edit their own notes
          switch (getCallerWorkerId(caller)) {
            case (?cid) {
              if (existing.createdBy != cid) {
                Runtime.trap("Unauthorized: Workers can only edit their own notes");
              };
            };
            case (null) {
              Runtime.trap("Unauthorized: No worker profile linked to this account");
            };
          };
        };
        let updated : Note = {
          noteId = existing.noteId;
          workerId = existing.workerId;
          noteType = existing.noteType;
          content;
          photoUrl;
          createdBy = existing.createdBy;
          createdAt = existing.createdAt;
          updatedAt = ?Time.now();
        };
        notes.add(noteId, updated);
      };
    };
  };

  // Delete a note — only owner can delete
  public shared ({ caller }) func deleteNote(noteId : NoteId) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can delete notes");
    };
    if (not notes.containsKey(noteId)) {
      Runtime.trap("Note not found");
    };
    notes.remove(noteId);
  };

  // Get notes by type — workers cannot see ownerInstruction or perWorker notes (except their own perWorker)
  public query ({ caller }) func getNotesByType(noteType : NoteType) : async [Note] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view notes");
    };
    if (not isOwnerPrincipal(caller)) {
      switch (noteType) {
        case (#ownerInstruction) {
          Runtime.trap("Unauthorized: Workers cannot view owner instructions via this endpoint; use getPublicAnnouncements");
        };
        case (#perWorker) {
          Runtime.trap("Unauthorized: Workers cannot list all per-worker notes");
        };
        case (_) {};
      };
    };
    notes.values().toList<Note>().filter(
      func(note : Note) : Bool {
        note.noteType == noteType;
      }
    ).toArray().sort();
  };

  // Workers get their own notes (work + material) plus public owner instructions
  public query ({ caller }) func getMyNotes() : async [Note] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view notes");
    };
    switch (getCallerWorkerId(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: No worker profile linked to this account");
      };
      case (?cid) {
        notes.values().toList<Note>().filter(
          func(note : Note) : Bool {
            switch (note.noteType) {
              case (#work) { note.workerId == cid };
              case (#material) { note.workerId == cid };
              case (#ownerInstruction) { true }; // public to all workers
              case (#perWorker) { note.workerId == cid }; // only their own
            };
          }
        ).toArray().sort();
      };
    };
  };

  // Owner gets all notes
  public query ({ caller }) func getAllNotes() : async [Note] {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can view all notes");
    };
    notes.values().toArray().sort();
  };

  module Note {
    public func compare(n1 : Note, n2 : Note) : Order.Order {
      Text.compare(n1.noteId, n2.noteId);
    };
  };

  // ---- Salary Management ----

  // Only owner can add/update salary records
  public shared ({ caller }) func addSalaryRecord(
    workerId : WorkerId,
    month : Nat,
    year : Nat,
    monthlySalary : Nat,
    presentDays : Nat,
    absentDays : Nat,
    cutDays : Nat,
    advanceAmount : Nat,
    carryForward : Int,
    companyHolidays : Nat,
  ) : async SalaryId {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can add salary records");
    };
    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    let salaryId = workerId # "-" # Nat32.fromNat(month).toText() # "-" # Nat32.fromNat(year).toText();
    let finalDeductibleDays : Int = if (cutDays > companyHolidays) {
      cutDays - companyHolidays;
    } else { 0 };
    let perDayRate : Int = monthlySalary / 30;
    let cutAmount : Int = finalDeductibleDays * perDayRate;
    let netPay : Int = monthlySalary - cutAmount - advanceAmount + carryForward;
    let newRecord : SalaryRecord = {
      salaryId;
      workerId;
      month;
      year;
      monthlySalary;
      presentDays;
      absentDays;
      cutDays;
      advanceAmount;
      carryForward;
      companyHolidays;
      netPay;
      manualOverride = false;
    };
    salaryRecords.add(salaryId, newRecord);
    salaryId;
  };

  public shared ({ caller }) func updateSalaryRecord(
    salaryId : SalaryId,
    monthlySalary : Nat,
    presentDays : Nat,
    absentDays : Nat,
    cutDays : Nat,
    advanceAmount : Nat,
    carryForward : Int,
    companyHolidays : Nat,
    manualOverride : Bool,
    overrideNetPay : ?Int,
  ) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can update salary records");
    };
    switch (salaryRecords.get(salaryId)) {
      case (null) { Runtime.trap("Salary record not found") };
      case (?existing) {
        let netPay : Int = switch (overrideNetPay) {
          case (?v) { v };
          case (null) {
            let finalDeductibleDays : Int = if (cutDays > companyHolidays) {
              cutDays - companyHolidays;
            } else { 0 };
            let perDayRate : Int = monthlySalary / 30;
            let cutAmount : Int = finalDeductibleDays * perDayRate;
            monthlySalary - cutAmount - advanceAmount + carryForward;
          };
        };
        let updated : SalaryRecord = {
          salaryId = existing.salaryId;
          workerId = existing.workerId;
          month = existing.month;
          year = existing.year;
          monthlySalary;
          presentDays;
          absentDays;
          cutDays;
          advanceAmount;
          carryForward;
          companyHolidays;
          netPay;
          manualOverride;
        };
        salaryRecords.add(salaryId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteSalaryRecord(salaryId : SalaryId) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can delete salary records");
    };
    if (not salaryRecords.containsKey(salaryId)) {
      Runtime.trap("Salary record not found");
    };
    salaryRecords.remove(salaryId);
  };

  // Workers can only view their own salary; owner can view any
  public query ({ caller }) func getSalaryRecord(workerId : WorkerId, month : Nat, year : Nat) : async ?SalaryRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view salary");
    };
    if (not isOwnerPrincipal(caller)) {
      switch (getCallerWorkerId(caller)) {
        case (?cid) {
          if (cid != workerId) {
            Runtime.trap("Unauthorized: Workers can only view their own salary");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No worker profile linked to this account");
        };
      };
    };
    let salaryId = workerId # "-" # Nat32.fromNat(month).toText() # "-" # Nat32.fromNat(year).toText();
    salaryRecords.get(salaryId);
  };

  public query ({ caller }) func getAllSalaryRecords() : async [SalaryRecord] {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can view all salary records");
    };
    salaryRecords.values().toArray().sort();
  };

  module SalaryRecord {
    public func compare(s1 : SalaryRecord, s2 : SalaryRecord) : Order.Order {
      Text.compare(s1.salaryId, s2.salaryId);
    };
  };

  // ---- Announcements Management ----

  // Only owner can add/edit/delete announcements
  public shared ({ caller }) func addAnnouncement(title : Text, content : Text) : async AnnouncementId {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can add announcements");
    };
    announcementCounter += 1;
    let announcementId = "ANN-" # Nat32.fromNat(announcementCounter).toText();
    let newAnnouncement : Announcement = {
      announcementId;
      title;
      content;
      createdAt = Time.now();
    };
    announcements.add(announcementId, newAnnouncement);
    announcementId;
  };

  public shared ({ caller }) func updateAnnouncement(
    announcementId : AnnouncementId,
    title : Text,
    content : Text,
  ) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can update announcements");
    };
    switch (announcements.get(announcementId)) {
      case (null) { Runtime.trap("Announcement not found") };
      case (?existing) {
        let updated : Announcement = {
          announcementId = existing.announcementId;
          title;
          content;
          createdAt = existing.createdAt;
        };
        announcements.add(announcementId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteAnnouncement(announcementId : AnnouncementId) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can delete announcements");
    };
    if (not announcements.containsKey(announcementId)) {
      Runtime.trap("Announcement not found");
    };
    announcements.remove(announcementId);
  };

  // All authenticated users can view announcements
  public query ({ caller }) func getAllAnnouncements() : async [Announcement] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view announcements");
    };
    announcements.values().toArray().sort();
  };

  module Announcement {
    public func compare(a1 : Announcement, a2 : Announcement) : Order.Order {
      Text.compare(a1.announcementId, a2.announcementId);
    };
  };

  // ---- Holiday Management ----

  // Only owner can add holidays
  public shared ({ caller }) func addHoliday(date : Text, name : Text, description : ?Text) : async HolidayId {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can add holidays");
    };
    holidayCounter += 1;
    let holidayId = "HOLIDAY-" # Nat32.fromNat(holidayCounter).toText();
    let newHoliday : Holiday = {
      holidayId;
      date;
      name;
      description;
      createdAt = Time.now();
    };
    holidays.add(holidayId, newHoliday);
    holidayId;
  };

  // Only owner can edit holidays
  public shared ({ caller }) func editHoliday(
    holidayId : HolidayId,
    date : Text,
    name : Text,
    description : ?Text,
  ) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can edit holidays");
    };
    switch (holidays.get(holidayId)) {
      case (null) { Runtime.trap("Holiday not found") };
      case (?existing) {
        let updated : Holiday = {
          holidayId = existing.holidayId;
          date;
          name;
          description;
          createdAt = existing.createdAt;
        };
        holidays.add(holidayId, updated);
      };
    };
  };

  // Only owner can update holidays (alias for editHoliday for backward compatibility)
  public shared ({ caller }) func updateHoliday(
    holidayId : HolidayId,
    date : Text,
    name : Text,
    description : ?Text,
  ) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can update holidays");
    };
    switch (holidays.get(holidayId)) {
      case (null) { Runtime.trap("Holiday not found") };
      case (?existing) {
        let updated : Holiday = {
          holidayId = existing.holidayId;
          date;
          name;
          description;
          createdAt = existing.createdAt;
        };
        holidays.add(holidayId, updated);
      };
    };
  };

  // Only owner can delete holidays
  public shared ({ caller }) func deleteHoliday(holidayId : HolidayId) : async () {
    if (not isOwnerPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only the owner can delete holidays");
    };
    if (not holidays.containsKey(holidayId)) {
      Runtime.trap("Holiday not found");
    };
    holidays.remove(holidayId);
  };

  // All authenticated users can view holidays
  public query ({ caller }) func getAllHolidays() : async [Holiday] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view holidays");
    };
    holidays.values().toArray().sort();
  };

  module Holiday {
    public func compare(h1 : Holiday, h2 : Holiday) : Order.Order {
      Text.compare(h1.holidayId, h2.holidayId);
    };
  };

  // ---- Owner Query ----
  // Allows the frontend to check whether an owner has been registered and whether the caller is the owner
  public query ({ caller }) func getOwnerStatus() : async { ownerRegistered : Bool; isOwner : Bool } {
    {
      ownerRegistered = switch (owner) { case (?_) { true }; case (null) { false } };
      isOwner = isOwnerPrincipal(caller);
    };
  };
};
