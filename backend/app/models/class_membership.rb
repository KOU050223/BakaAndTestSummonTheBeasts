class ClassMembership < ApplicationRecord
  belongs_to :user
  belongs_to :school_class

  validates :user_id, uniqueness: true
end
