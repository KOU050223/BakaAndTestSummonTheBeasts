class UserSerializer
  def initialize(user)
    @user = user
  end

  def as_json(*)
    {
      id: @user.id,
      name: @user.name,
      email: @user.email,
      role: @user.role,
      created_at: @user.created_at.iso8601,
      school_class: school_class_json
    }
  end

  private

  def school_class_json
    sc = @user.school_class
    return nil unless sc
    { id: sc.id, name: sc.name }
  end
end
