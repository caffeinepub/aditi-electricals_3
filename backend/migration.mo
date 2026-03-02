import Principal "mo:core/Principal";

module {
  public type OldActor = {};
  public type NewActor = { owner : ?Principal };

  public func run(_ : OldActor) : NewActor {
    { owner = null };
  };
};
