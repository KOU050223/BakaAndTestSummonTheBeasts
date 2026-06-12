module Api
  module V1
    class AuthController < ActionController::API
      def login
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          token = JwtService.encode(user_id: user.id)
          render json: {
            token: token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          }, status: :ok
        else
          render json: { error: "メールアドレスまたはパスワードが正しくありません" }, status: :unauthorized
        end
      end
    end
  end
end
