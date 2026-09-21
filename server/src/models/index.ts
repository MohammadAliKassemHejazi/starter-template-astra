import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from 'sequelize';
import { sequelize } from '../db/sequelize';

const uuidPk = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true } as const;

export class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: CreationOptional<string>;
  declare key: string;
  declare description: string | null;
}
Permission.init(
  { id: uuidPk, key: { type: DataTypes.STRING(100), allowNull: false, unique: true }, description: DataTypes.STRING(255) },
  { sequelize, tableName: 'permissions', timestamps: false, underscored: true },
);

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: string | null;
  declare isSystem: CreationOptional<boolean>;
  declare permissions?: NonAttribute<Permission[]>;
}
Role.init(
  {
    id: uuidPk,
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: DataTypes.STRING(255),
    isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'roles', underscored: true },
);

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare name: string;
  declare isActive: CreationOptional<boolean>;
  declare lastLoginAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare roles?: NonAttribute<Role[]>;
}
User.init(
  {
    id: uuidPk,
    email: { type: DataTypes.CITEXT, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLoginAt: DataTypes.DATE,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'users', underscored: true },
);

export class UserRole extends Model<InferAttributes<UserRole>, InferCreationAttributes<UserRole>> {
  declare userId: string;
  declare roleId: string;
}
UserRole.init(
  { userId: { type: DataTypes.UUID, primaryKey: true }, roleId: { type: DataTypes.UUID, primaryKey: true } },
  { sequelize, tableName: 'user_roles', timestamps: false, underscored: true },
);

export class RolePermission extends Model<InferAttributes<RolePermission>, InferCreationAttributes<RolePermission>> {
  declare roleId: string;
  declare permissionId: string;
}
RolePermission.init(
  { roleId: { type: DataTypes.UUID, primaryKey: true }, permissionId: { type: DataTypes.UUID, primaryKey: true } },
  { sequelize, tableName: 'role_permissions', timestamps: false, underscored: true },
);

User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId', as: 'users' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId', as: 'roles' });
