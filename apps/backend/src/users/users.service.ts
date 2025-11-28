import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role, ROLE_NAMES, RoleName } from './entities/role.entity';
import { UserNotificationSettings } from './entities/user-notification-settings.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { PasswordService } from '../common/services/password.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepository: Repository<Role>,
    @InjectRepository(UserNotificationSettings)
    private readonly notificationSettingsRepository: Repository<UserNotificationSettings>,
    private readonly passwordService: PasswordService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['role'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['role'],
      order: { fullName: 'ASC', id: 'ASC' },
    });
  }

  async create(dto: CreateUserDto, userId?: number): Promise<User> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Получаем роль
    const role = await this.ensureRoleExists(dto.roleName);
    if (!role) {
      throw new NotFoundException(`Роль "${dto.roleName}" не найдена`);
    }

    // Хешируем пароль
    const passwordHash = await this.passwordService.hash(dto.password);

    // Создаем пользователя
    const user = this.usersRepository.create({
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      fullName: dto.fullName.trim(),
      role,
      roleId: role.id,
      createdById: userId,
      updatedById: userId,
    });

    const savedUser = await this.usersRepository.save(user);

    // Загружаем пользователя с ролью
    return this.findById(savedUser.id) as Promise<User>;
  }

  async update(id: number, dto: UpdateUserDto, userId?: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    // Проверяем, не используется ли email другим пользователем
    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      user.email = dto.email.trim().toLowerCase();
    }

    // Обновляем пароль, если он указан
    if (dto.password) {
      user.passwordHash = await this.passwordService.hash(dto.password);
    }

    // Обновляем ФИО, если оно указано
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }

    // Обновляем роль, если она указана
    if (dto.roleName !== undefined) {
      const role = await this.ensureRoleExists(dto.roleName);
      if (!role) {
        throw new NotFoundException(`Роль "${dto.roleName}" не найдена`);
      }
      user.role = role;
      user.roleId = role.id;
    }

    user.updatedById = userId || null;
    await this.usersRepository.save(user);

    // Загружаем пользователя с ролью
    return this.findById(id) as Promise<User>;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    // Нельзя удалить самого себя (если id передан в контексте)
    // Это будет проверяться в контроллере

    await this.usersRepository.remove(user);
  }

  async ensureRoleExists(name: RoleName): Promise<Role> {
    let role = await this.rolesRepository.findOne({ where: { name } });
    if (!role) {
      role = this.rolesRepository.create({ name });
      await this.rolesRepository.save(role);
    }
    return role;
  }

  async ensureDefaultRoles(): Promise<void> {
    await Promise.all(ROLE_NAMES.map((roleName) => this.ensureRoleExists(roleName)));
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`Пользователь #${userId} не найден`);
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await this.passwordService.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    // Проверяем, что новый пароль отличается от текущего
    const isSamePassword = await this.passwordService.compare(
      newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException('Новый пароль должен отличаться от текущего');
    }

    // Хешируем новый пароль
    const newPasswordHash = await this.passwordService.hash(newPassword);

    // Обновляем пароль
    user.passwordHash = newPasswordHash;
    user.updatedById = userId;
    await this.usersRepository.save(user);
  }

  async getNotificationSettings(userId: number): Promise<UserNotificationSettings> {
    let settings = await this.notificationSettingsRepository.findOne({
      where: { userId },
    });

    // Если настройки не существуют, создаем их с дефолтными значениями
    if (!settings) {
      settings = this.notificationSettingsRepository.create({
        userId,
        emailEnabled: true,
        buybackRemindersEnabled: true,
        buybackReminder60Days: true,
        buybackReminder30Days: true,
        buybackReminder7Days: true,
        salesNotificationsEnabled: true,
        shipmentNotificationsEnabled: true,
        financeNotificationsEnabled: true,
      });
      await this.notificationSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateNotificationSettings(
    userId: number,
    dto: UpdateNotificationSettingsDto,
  ): Promise<UserNotificationSettings> {
    // Проверяем, существует ли пользователь
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    let settings = await this.notificationSettingsRepository.findOne({
      where: { userId },
    });

    // Если настройки не существуют, создаем их
    if (!settings) {
      settings = this.notificationSettingsRepository.create({
        userId,
        emailEnabled: dto.emailEnabled ?? true,
        buybackRemindersEnabled: dto.buybackRemindersEnabled ?? true,
        buybackReminder60Days: dto.buybackReminder60Days ?? true,
        buybackReminder30Days: dto.buybackReminder30Days ?? true,
        buybackReminder7Days: dto.buybackReminder7Days ?? true,
        salesNotificationsEnabled: dto.salesNotificationsEnabled ?? true,
        shipmentNotificationsEnabled: dto.shipmentNotificationsEnabled ?? true,
        financeNotificationsEnabled: dto.financeNotificationsEnabled ?? true,
      });
    } else {
      // Обновляем только переданные поля
      if (dto.emailEnabled !== undefined) {
        settings.emailEnabled = dto.emailEnabled;
      }
      if (dto.buybackRemindersEnabled !== undefined) {
        settings.buybackRemindersEnabled = dto.buybackRemindersEnabled;
      }
      if (dto.buybackReminder60Days !== undefined) {
        settings.buybackReminder60Days = dto.buybackReminder60Days;
      }
      if (dto.buybackReminder30Days !== undefined) {
        settings.buybackReminder30Days = dto.buybackReminder30Days;
      }
      if (dto.buybackReminder7Days !== undefined) {
        settings.buybackReminder7Days = dto.buybackReminder7Days;
      }
      if (dto.salesNotificationsEnabled !== undefined) {
        settings.salesNotificationsEnabled = dto.salesNotificationsEnabled;
      }
      if (dto.shipmentNotificationsEnabled !== undefined) {
        settings.shipmentNotificationsEnabled = dto.shipmentNotificationsEnabled;
      }
      if (dto.financeNotificationsEnabled !== undefined) {
        settings.financeNotificationsEnabled = dto.financeNotificationsEnabled;
      }
    }

    const saved = await this.notificationSettingsRepository.save(settings);
    return saved;
  }
}

