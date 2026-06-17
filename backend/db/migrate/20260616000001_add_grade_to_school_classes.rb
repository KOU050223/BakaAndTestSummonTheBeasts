class AddGradeToSchoolClasses < ActiveRecord::Migration[8.1]
  def change
    # 学年（1〜3年）。既存行のため一旦 default 2 で埋めてから null 制約を付ける。
    add_column :school_classes, :grade, :integer, null: false, default: 2

    # 同名クラス（Aクラス等）は学年ごとに存在しうるため、name 単独の一意制約から
    # [grade, name] の複合一意に変更する。
    add_index :school_classes, [ :grade, :name ], unique: true
  end
end
