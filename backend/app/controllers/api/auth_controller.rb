module Api
  class AuthController < ActionController::API
    include ActionController::Cookies
    include Api::ErrorRenderable

    def login
      input = Auth::LoginInput.new(login_params)
      unless input.valid?
        return render_error(
          code: "validation_error",
          message: "入力内容を確認してください",
          status: :unprocessable_entity,
          details: input.errors.to_hash
        )
      end

      result = Auth::Login.call(input)
      set_auth_cookie(result[:token])
      render json: { user: UserSerializer.new(result[:user]).as_json }, status: :ok
    rescue Auth::Login::AuthenticationError
      render_error(code: "unauthorized", message: "メールアドレスまたはパスワードが正しくありません", status: :unauthorized)
    end

    def signup
      input = Auth::SignupInput.new(signup_params)
      unless input.valid?
        return render_error(
          code: "validation_error",
          message: "入力内容を確認してください",
          status: :unprocessable_entity,
          details: input.errors.to_hash
        )
      end

      result = Auth::Signup.call(input)
      set_auth_cookie(result[:token])
      render json: { user: UserSerializer.new(result[:user]).as_json }, status: :created
    rescue Auth::Signup::EmailTakenError
      render_error(code: "conflict", message: "このメールアドレスはすでに使用されています", status: :conflict)
    end

    def logout
      # トークンの有効性に関わらず Cookie を削除する（HttpOnly なのでフロントから消せないため）
      cookies.delete(:token)
      render json: { message: "ログアウトしました" }, status: :ok
    end

    private

    def login_params
      params.permit(:email, :password)
    end

    def signup_params
      params.permit(:name, :email, :password).merge(role: "student")
    end

    def set_auth_cookie(token)
      cookies[:token] = {
        value: token,
        httponly: true,
        secure: Rails.env.production?,
        same_site: Rails.env.production? ? :none : :lax
      }
    end
  end
end
