module Api
  class UsersController < BaseController
    def me
      render json: {
        id: current_user.id,
        name: current_user.name,
        email: current_user.email,
        role: current_user.role
      }, status: :ok
    end
  end
end
