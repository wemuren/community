import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="settings-header" style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} className="btn-back">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Назад
        </button>
        <h1 className="user-name" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Eye size={32} color="var(--primary-red)" />
          Политика конфиденциальности
        </h1>
      </div>

      <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.6' }}>
        <section>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-main)' }}>1. Какие данные мы собираем</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Мы собираем только те данные, которые необходимы для стабильной работы платформы:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Данные профиля: Email адрес, имя пользователя, кастомные аватары и баннеры.</li>
            <li>Технические логи: Данные о просмотрах видео для формирования внутренней аналитики Студии и выявления автора дня.</li>
            <li>Сессионные данные: Токены авторизации и слепки конфигурации интерфейса, сохраняемые локально на вашем устройстве (LocalStorage).</li>
          </ul>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)' }} />

        <section>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-main)' }}>2. Как используются данные</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Сбор информации направлен на персонализацию вашего интерфейса, защиту от спам-регистраций, валидацию транзакций по Premium-подпискам, а также для работы внутренних алгоритмов рекомендаций и счетчиков контента (лайки, сохранения, просмотры). Мы не передаем ваши личные данные сторонним организациям и коммерческим сервисам.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)' }} />

        <section>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-main)' }}>3. Безопасность данных</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Пароли пользователей хранятся в базе данных в захешированном виде (с использованием криптографических алгоритмов BCRYPT) и не могут быть прочитаны администрацией платформы. Все операции по изменению конфиденциальных данных (смена Email, паролей) защищены обязательной двухэтапной верификацией по одноразовым кодам.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)' }} />

        <section>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-main)' }}>4. Хранение контента</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Загружаемые вами медиафайлы (обложки видео, аватары каналов) сохраняются на сервере в изолированных директориях и доступны для публичного просмотра согласно установленным вами настройкам приватности плейлистов и видеороликов.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)' }} />

        <section>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-main)' }}>5. Управление своими данными</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Вы имеете полное право редактировать свою информацию в любой момент. При отправке запроса на удаление аккаунта, база данных принудительно очищает все таблицы, связанные с вашим ID (включая логи просмотров, подписки и кэш кодов), полностью стирая ваш цифровой след на платформе.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;