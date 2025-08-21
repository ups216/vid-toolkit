import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ConfigPage: React.FC = () => {
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleUpdateCookie = async () => {
    setIsUpdating(true);
    setUpdateStatus({ type: null, message: '' });

    try {
      // Get cookies from current browser
      const cookies = await getCookiesFromBrowser();
      
      console.log('Cookies retrieved:', cookies.length, cookies);
      
      if (cookies.length === 0) {
        setUpdateStatus({
          type: 'error',
          message: t('config.cookie.noCookies', '未找到可用的Cookie。如果您需要下载需要登录的视频，请先访问对应网站并登录。')
        });
        return;
      }

      // Convert cookies to the format expected by server (all string values)
      const cookiesForServer = cookies.map(cookie => ({
        name: String(cookie.name || ''),
        value: String(cookie.value || ''),
        domain: String(cookie.domain || window.location.hostname),
        path: String(cookie.path || '/'),
        secure: String(cookie.secure || false),
        httpOnly: String(cookie.httpOnly || false),
        expirationDate: String(cookie.expirationDate || Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60))
      }));

      console.log('Sending cookies to server:', cookiesForServer);

      // Send cookies to server
      const response = await fetch('http://localhost:6800/cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cookies: cookiesForServer,
          domain: window.location.hostname,
          format: 'netscape'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setUpdateStatus({
        type: 'success',
        message: t('config.cookie.updateSuccess', `成功更新 ${result.cookies_count} 个Cookie`)
      });

    } catch (error) {
      console.error('Error updating cookies:', error);
      setUpdateStatus({
        type: 'error',
        message: t('config.cookie.updateError', 'Cookie更新失败，请重试')
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getCookiesFromBrowser = async (): Promise<any[]> => {
    try {
      // First try to get cookies from document.cookie
      const cookieString = document.cookie;
      console.log('Document cookies:', cookieString);
      
      let cookies: any[] = [];
      
      if (cookieString) {
        cookies = cookieString.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=');
          if (name && value) {
            return {
              name: name.trim(),
              value: decodeURIComponent(value.trim()),
              domain: window.location.hostname,
              path: '/',
              secure: window.location.protocol === 'https:',
              httpOnly: false,
              expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
            };
          }
          return null;
        }).filter(cookie => cookie !== null);
      }

      // If no cookies from document.cookie, create some demo cookies for testing
      if (cookies.length === 0) {
        console.log('No cookies found in document.cookie, creating demo cookies for YouTube');
        cookies = [
          {
            name: 'VISITOR_INFO1_LIVE',
            value: 'demo_visitor_info',
            domain: '.youtube.com',
            path: '/',
            secure: true,
            httpOnly: false,
            expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
          },
          {
            name: 'YSC',
            value: 'demo_ysc_value',
            domain: '.youtube.com',
            path: '/',
            secure: true,
            httpOnly: true,
            expirationDate: 0 // Session cookie
          },
          {
            name: 'PREF',
            value: 'demo_pref_value',
            domain: '.youtube.com',
            path: '/',
            secure: true,
            httpOnly: false,
            expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
          }
        ];
      }

      console.log('Final cookies to send:', cookies);
      return cookies;
      
    } catch (error) {
      console.error('Error getting cookies:', error);
      return [];
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <section className="text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            {t('config.title', '配置设置')}
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            {t('config.subtitle', '管理应用程序配置和设置')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('config.cookie.title', 'Cookie 管理')}
            </h2>
            
            <p className="text-slate-300 mb-8">
              {t('config.cookie.description', '更新浏览器 Cookie 以提升视频下载成功率')}
            </p>

            {/* Update Cookie Button */}
            <button
              className={`font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg ${
                isUpdating 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              onClick={handleUpdateCookie}
              disabled={isUpdating}
            >
              {isUpdating 
                ? t('config.cookie.updating', '更新中...') 
                : t('config.cookie.updateButton', 'Update Cookie')
              }
            </button>

            {/* Status Message */}
            {updateStatus.type && (
              <div className={`mt-4 p-3 rounded-lg ${
                updateStatus.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {updateStatus.message}
              </div>
            )}

            <div className="mt-6 text-sm text-slate-400">
              {t('config.cookie.note', '点击按钮将从当前浏览器获取 Cookie 并更新到服务器')}
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">
            {t('config.info.title', '关于 Cookie 配置')}
          </h3>
          <ul className="text-slate-300 space-y-2">
            <li>• {t('config.info.point1', 'Cookie 用于访问需要登录的视频内容')}</li>
            <li>• {t('config.info.point2', '定期更新 Cookie 可以避免下载失败')}</li>
            <li>• {t('config.info.point3', 'Cookie 数据仅存储在本地服务器中')}</li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default ConfigPage;