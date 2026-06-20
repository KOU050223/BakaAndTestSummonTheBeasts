ENV['DEMO_ADMIN_PASSWORD'] ||= 'password'
ENV['DEMO_USER_PASSWORD'] ||= 'password'

load Rails.root.join('db/seeds/demo.rb')
