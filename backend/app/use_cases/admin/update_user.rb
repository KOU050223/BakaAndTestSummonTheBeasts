class Admin::UpdateUser
  EmailTakenError = Class.new(StandardError)

  def self.call(user, input)
    new_email = input.email.to_s.downcase.strip
    if User.where.not(id: user.id).exists?(email: new_email)
      raise EmailTakenError
    end

    user.name = input.name
    user.email = new_email
    user.role = input.role
    # パスワードは未指定なら据え置く。
    user.password = input.password if input.password.present?

    user.save!

    { user: user }
  end
end
