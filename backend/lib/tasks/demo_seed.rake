namespace :db do
  namespace :seed do
    desc "デモ環境用の初期データを投入する"
    task demo: :environment do
      load Rails.root.join("db/seeds/demo.rb")
    end
  end
end
