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
          # クラス管理画面向けのクラス概要（学年・平均スコア・在籍人数）。
          # 一覧と生徒一覧の両エンドポイントで共有するため共通定義する。
          ClassSummary: {
            type: :object,
            properties: {
              id:           { type: :integer },
              name:         { type: :string },
              grade:        { type: :integer },
              averageScore: { type: :integer },
              studentCount: { type: :integer }
            },
            required: %w[id name grade averageScore studentCount]
          },
          ClassListResponse: {
            type: :object,
            properties: {
              classes: {
                type: :array,
                items: { '$ref' => '#/components/schemas/ClassSummary' }
              }
            },
            required: %w[classes]
          },
          # クラス内生徒（総合スコア・最高科目）。複数箇所で再利用する。
          ClassStudent: {
            type: :object,
            properties: {
              id:         { type: :integer },
              name:       { type: :string },
              grade:      { type: :integer },
              totalScore: { type: :integer },
              topSubject: {
                type: :object,
                properties: {
                  name:  { type: :string },
                  score: { type: :integer }
                },
                required: %w[name score]
              }
            },
            required: %w[id name grade totalScore topSubject]
          },
          ClassStudentListResponse: {
            type: :object,
            properties: {
              classId:  { type: :integer },
              students: {
                type: :array,
                items: { '$ref' => '#/components/schemas/ClassStudent' }
              }
            },
            required: %w[classId students]
          },
          # クラス振り分けの一括反映の結果。更新できた件数を返す。
          AssignmentUpdateResponse: {
            type: :object,
            properties: {
              updatedCount: { type: :integer }
            },
            required: %w[updatedCount]
          },
          # クラス変更の結果。変更後の所属クラスを返す。
          ClassChangeResponse: {
            type: :object,
            properties: {
              studentId: { type: :integer },
              schoolClass: {
                type: :object,
                properties: {
                  id:    { type: :integer },
                  name:  { type: :string },
                  grade: { type: :integer }
                },
                required: %w[id name grade]
              }
            },
            required: %w[studentId schoolClass]
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
