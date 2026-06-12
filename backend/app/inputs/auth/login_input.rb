class Auth::LoginInput
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :email, :string
  attribute :password, :string

  validates :email, presence: true
  validates :password, presence: true
end
