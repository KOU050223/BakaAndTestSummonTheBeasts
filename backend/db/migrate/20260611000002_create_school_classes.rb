class CreateSchoolClasses < ActiveRecord::Migration[8.1]
  def change
    create_table :school_classes do |t|
      t.string :name, null: false  # 例: "Aクラス", "Fクラス"

      t.timestamps
    end
  end
end
