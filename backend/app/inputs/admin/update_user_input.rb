class Admin::UpdateUserInput
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :name, :string
  attribute :email, :string
  # 更新時はパスワード未指定（変更しない）を許可するため presence を課さない。
  attribute :password, :string
  attribute :role, :string

  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, allow_blank: true
  validates :role, presence: true, inclusion: { in: User::ROLES }
end
