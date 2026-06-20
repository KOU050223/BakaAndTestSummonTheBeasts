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
          ClassSubjectAverage: {
            type: :object,
            properties: {
              subject:       { type: :string },
              subjectLabel:  { type: :string },
              averageScore:  { type: :integer }
            },
            required: %w[subject subjectLabel averageScore]
          },
          ClassSummary: {
            type: :object,
            properties: {
              id:           { type: :integer },
              name:         { type: :string },
              grade:        { type: :integer },
              averageScore: { type: :integer, description: "全教科合計点のクラス平均" },
              studentCount: { type: :integer },
              subjectAverages: {
                type: :array,
                items: { '$ref' => '#/components/schemas/ClassSubjectAverage' }
              }
            },
            required: %w[id name grade averageScore studentCount subjectAverages]
          },
          ClassListResponse: {
            type: :object,
            properties: {
              classes: {
                type: :array,
                items: { '$ref' => '#/components/schemas/ClassSummary' }
              },
              gradeMaxTotalScore: {
                type: :integer,
                description: "学年内在籍生徒の全教科合計点の最高値（grade 指定時のみ）"
              },
              gradeMaxScoreBySubject: {
                type: :object,
                additionalProperties: { type: :integer },
                description: "学年内在籍生徒の教科別合計点の最高値（grade 指定時のみ）"
              }
            },
            required: %w[classes]
          },
          # クラス内生徒（総合スコア・最高科目・リーダーフラグ）。複数箇所で再利用する。
          ClassStudent: {
            type: :object,
            properties: {
              id:         { type: :integer },
              name:       { type: :string },
              grade:      { type: :integer },
              leader:     { type: :boolean, description: "クラスのリーダーかどうか" },
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
            required: %w[id name grade leader totalScore topSubject]
          },
          # リーダー設定の結果。
          ClassLeaderResponse: {
            type: :object,
            properties: {
              classId:  { type: :integer },
              leaderId: { type: :integer, nullable: true }
            },
            required: %w[classId]
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
          # 管理者ユーザー管理向け。一覧の統計と作成/更新リクエストを複数箇所で共有する。
          # ロール別件数を起点に、今後アクティブ数などの指標も足せるようサマリーとして定義する。
          AdminUserSummary: {
            type: :object,
            properties: {
              student_count: { type: :integer },
              teacher_count: { type: :integer },
              admin_count:   { type: :integer },
              total_count:   { type: :integer }
            },
            required: %w[student_count teacher_count admin_count total_count]
          },
          AdminUserCreateRequest: {
            type: :object,
            properties: {
              name:     { type: :string, example: '鈴木先生' },
              email:    { type: :string, example: 'teacher@example.com' },
              password: { type: :string, example: 'password123' },
              role:     { '$ref' => '#/components/schemas/Role' }
            },
            required: %w[name email password role]
          },
          AdminUserUpdateRequest: {
            type: :object,
            properties: {
              name:     { type: :string, example: '霧島翔子' },
              email:    { type: :string, example: 'kirishima@example.com' },
              password: { type: :string, example: 'password123', description: '未指定なら変更しない' },
              role:     { '$ref' => '#/components/schemas/Role' }
            },
            required: %w[name email role]
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
