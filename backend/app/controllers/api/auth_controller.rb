module Api
  class AuthController < ActionController::API
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
      render json: {
        token: result[:token],
        user: UserSerializer.new(result[:user]).as_json
      }, status: :ok
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
      render json: {
        token: result[:token],
        user: UserSerializer.new(result[:user]).as_json
      }, status: :created
    rescue Auth::Signup::EmailTakenError
      render_error(code: "conflict", message: "このメールアドレスはすでに使用されています", status: :conflict)
    end

    def logout
      header = request.headers["Authorization"]
      unless header&.start_with?("Bearer ")
        return render_error(code: "unauthorized", message: "認証が必要です", status: :unauthorized)
      end

      token = header.split(" ").last
      if JwtService.decode(token).nil?
        return render_error(code: "unauthorized", message: "認証トークンが無効です", status: :unauthorized)
      end

      render json: { message: "ログアウトしました" }, status: :ok
    end

    private

    def login_params
      params.permit(:email, :password)
    end

    def signup_params
      params.permit(:name, :email, :password).merge(role: "student")
    end
  end
end
