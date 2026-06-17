Rails.application.routes.draw do
  mount Rswag::Ui::Engine => "/api-docs"
  mount Rswag::Api::Engine => "/api-docs"
  get "up" => "rails/health#show", as: :rails_health_check

  # MVP REST API。認証(auth/login, me)以外は apiSpec.md 準拠の固定モックJSONを返すスタブ。
  # フロントエンドが本番と同じURL・レスポンス形で全画面に着手できることを目的とする。
  # Rails本実装が進むにつれてスタブを順次差し替える。
  namespace :api do
    post "auth/login", to: "auth#login"
    post "auth/signup", to: "auth#signup"
    delete "auth/logout", to: "auth#logout"

    namespace :admin do
      resources :users, only: [ :create ]
    end
    get "me", to: "users#me"

    # クラス編成
    resources :classes, only: [ :index ] do
      resources :students, only: [ :index ], module: :classes
    end
    # クラス振り分けの一括反映（自動振り分けの保存）
    patch "classes/assignments", to: "classes/assignments#update"

    # 試験・点数
    resources :exams, only: [ :index, :create ] do
      resources :scores, only: [ :index ], module: :exams
    end
    resources :scores, only: [ :create ]

    # 召喚獣
    get "students/:id/summon", to: "students#summon"

    # クラス変更（教師がクラス管理画面から生徒の所属クラスを変更する）
    patch "students/:id/class", to: "students#update_class"

    # バトル（Go Game Server連携部はモック）
    resources :battles, only: [ :index, :create ] do
      member do
        get :result
      end
    end
  end

  # Go Game Server 専用 internal API（モック）。
  # 本実装では共有シークレット認証を入れる（docs/backend-design.md §8）。
  namespace :internal do
    get "battles/:battle_id/start-data", to: "battles#start_data"
    post "battles/:battle_id/finish", to: "battles#finish"
  end
end
