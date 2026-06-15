Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    allowed_origins =
      if Rails.env.production?
        [ ENV.fetch("FRONTEND_URL") ]
      else
        [ ENV.fetch("FRONTEND_URL", "http://localhost:3000"), "http://127.0.0.1:3000" ]
      end
    origins(*allowed_origins)

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
