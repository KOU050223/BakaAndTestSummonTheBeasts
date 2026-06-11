class CreateClassMemberships < ActiveRecord::Migration[8.1]
  def change
    create_table :class_memberships do |t|
      # index: false で自動インデックスを抑制し、下でユニーク制約を明示する
      t.references :user, null: false, foreign_key: true, index: false
      t.references :school_class, null: false, foreign_key: true

      t.timestamps
    end

    # 1人の生徒は1クラスのみに所属（MVPでは複数クラス所属は扱わない）
    add_index :class_memberships, :user_id, unique: true
  end
end
