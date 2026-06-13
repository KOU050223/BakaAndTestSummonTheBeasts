# frozen_string_literal: true

require 'rails_helper'

RSpec.configure do |config|
  config.openapi_root = Rails.root.to_s

  config.openapi_specs = {
    'openapi.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'バカとテストと召喚獣 API',
        description: '学力バトルゲームのバックエンドAPI',
        version: 'v1'
      },
      paths: {},
      servers: [
        { url: 'http://localhost:8000', description: 'ローカル開発環境' }
      ],
      components: {
        securitySchemes: {
          bearer_auth: {
            type: :http,
            scheme: :bearer,
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          error: {
            type: :object,
            properties: {
              error: { type: :string }
            },
            required: [ 'error' ]
          }
        }
      }
    }
  }

  config.openapi_format = :yaml
end
