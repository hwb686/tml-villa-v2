import { useLanguage } from '@/hooks/useLanguage';

export default function Footer() {
  const { t } = useLanguage();

  const footerLinks = {
    about: ['关于 TML Villa', '工作机会', '新闻中心', '政策', '无障碍设施'],
    support: ['帮助中心', '安全信息', '取消选项', '举报问题'],
    hosting: ['出租房源', '开展体验', '资源中心', '社区论坛'],
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="container-luxury py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-medium text-ink mb-4">{t.footer.about}</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link}><a href="#" className="text-sm text-gray-600 hover:underline">{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-ink mb-4">{t.footer.support}</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link}><a href="#" className="text-sm text-gray-600 hover:underline">{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-ink mb-4">{t.footer.hosting}</h4>
            <ul className="space-y-3">
              {footerLinks.hosting.map((link) => (
                <li key={link}><a href="#" className="text-sm text-gray-600 hover:underline">{link}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>© 2026 TML Villa, Inc.</span>
            <span>·</span>
            <a href="#" className="hover:underline">{t.footer.privacy}</a>
            <span>·</span>
            <a href="#" className="hover:underline">{t.footer.terms}</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <span className="text-champagne">฿</span>
              <span>THB</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
