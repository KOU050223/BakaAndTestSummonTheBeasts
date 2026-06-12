Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    post "auth/login", to: "auth#login"
    get "me", to: "users#me"
  end
end
