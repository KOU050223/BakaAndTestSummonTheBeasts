class AddLeaderToClassMemberships < ActiveRecord::Migration[8.1]
  def change
    add_column :class_memberships, :leader, :boolean, default: false, null: false
    add_index :class_memberships, [ :school_class_id, :leader ],
              where: "leader = true",
              unique: true,
              name: "index_class_memberships_on_school_class_id_unique_leader"
  end
end
