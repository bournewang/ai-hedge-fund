import { FlowProvider } from '@/contexts/flow-context';
import { ReactFlowProvider } from '@xyflow/react';
import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ReactFlowProvider>
        <FlowProvider>
          {/* Main content area takes full width */}
          <main className="flex-1 h-full overflow-auto w-full">
            {children}
          </main>
        </FlowProvider>
      </ReactFlowProvider>
    </div>
  );
}