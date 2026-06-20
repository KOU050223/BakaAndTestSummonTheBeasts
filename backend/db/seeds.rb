seed_file = Rails.root.join("db/seeds/#{Rails.env}.rb")

if seed_file.exist?
  load seed_file
else
  puts "#{Rails.env} 環境用のシードデータはありません"
end
