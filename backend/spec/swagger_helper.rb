# frozen_string_literal: true

require 'rails_helper'

RSpec.configure do |config|
  config.openapi_root = Rails.root.join('../docs').to_s

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
          cookie_auth: {
            type: :apiKey,
            in: :cookie,
            name: :token
          }
        },
        schemas: {
          Role: {
            type: :string,
            enum: %w[student teacher school_admin]
          },
          AuthResponse: {
            type: :object,
            properties: {
              user: { '$ref' => '#/components/schemas/User' }
            },
            required: %w[user]
          },
          SchoolClass: {
            type: :object,
            properties: {
              id:   { type: :integer },
              name: { type: :string }
            },
            required: %w[id name]
          },
          User: {
            type: :object,
            properties: {
              id:           { type: :integer },
              name:         { type: :string },
              email:        { type: :string },
              role:         { '$ref' => '#/components/schemas/Role' },
              created_at:   { type: :string, format: 'date-time' },
              school_class: {
                nullable: true,
                type: :object,
                properties: {
                  id:   { type: :integer },
                  name: { type: :string }
                }
              }
            },
            required: %w[id name email role created_at school_class]
          },
          error: {
            type: :object,
            properties: {
              error: {
                type: :object,
                properties: {
                  code: { type: :string },
                  message: { type: :string },
                  details: { type: :object }
                },
                required: %w[code message details]
              }
            },
            required: [ 'error' ]
          }
        }
      }
    }
  }

  config.openapi_format = :yaml
end
