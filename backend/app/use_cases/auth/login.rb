class Auth::Login
  AuthenticationError = Class.new(StandardError)

  def self.call(input)
    user = User.find_by(email: input.email.to_s.downcase.strip)
    raise AuthenticationError unless user&.authenticate(input.password)

    token = JwtService.encode(user_id: user.id)
    { token: token, user: user }
  end
end
