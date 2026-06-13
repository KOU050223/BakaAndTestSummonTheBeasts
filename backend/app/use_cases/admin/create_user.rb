class Admin::CreateUser
  EmailTakenError = Class.new(StandardError)

  def self.call(input)
    raise EmailTakenError if User.exists?(email: input.email.to_s.downcase.strip)

    user = User.create!(
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role
    )

    { user: user }
  end
end
