import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export function LanguageSwitcher() {
  const { changeLanguage, isEnglish } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <div className="flex rounded-md border border-input bg-background p-1">
        <Button
          variant={isEnglish ? "default" : "ghost"}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => changeLanguage('en')}
        >
          EN
        </Button>
        <Button
          variant={!isEnglish ? "default" : "ghost"}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => changeLanguage('zh')}
        >
          中文
        </Button>
      </div>
    </div>
  );
}