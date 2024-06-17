/** @jsxImportSource @emotion/react */
import type { MessageContent as MessageContentType } from '@cord-sdk/types';
import { MessageContent } from '@cord-sdk/react';

type MessageContentCardProps = {
  message: object[];
  className?: string;
};

function MessageContentCard({ className, message }: MessageContentCardProps) {
  return (
    <div
      css={{
        alignItems: 'center',
        background: '#dadce0',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '8px',
        padding: '16px',
      }}
      className={className}
    >
      <MessageContent
        css={{
          background: '#fff',
          color: '#000',
          padding: '16px',
          borderRadius: '8px',
          width: 400,
        }}
        content={message as MessageContentType}
        edited={false}
      />
    </div>
  );
}

export default MessageContentCard;
