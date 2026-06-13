class Auth::Signup
  EmailTakenError = Class.new(StandardError)

  def self.call(input)
    raise EmailTakenError if User.exists?(email: input.email.to_s.downcase.strip)

    user = User.create!(
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role
    )

    token = JwtService.encode(user_id: user.id)
    { token: token, user: user }
  end
end
