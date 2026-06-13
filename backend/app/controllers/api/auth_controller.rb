module Api
  class AuthController < ActionController::API
    def login
      input = Auth::LoginInput.new(login_params)
      unless input.valid?
        return render json: { errors: input.errors.to_hash }, status: :unprocessable_entity
      end

      result = Auth::Login.call(input)
      render json: {
        token: result[:token],
        user: UserSerializer.new(result[:user]).as_json
      }, status: :ok
    rescue Auth::Login::AuthenticationError
      render json: { error: "メールアドレスまたはパスワードが正しくありません" }, status: :unauthorized
    end

    private

    def login_params
      params.permit(:email, :password)
    end
  end
end
