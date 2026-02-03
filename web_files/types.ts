
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  imageUrl?: string;
  status?: 'streaming' | 'complete' | 'error';
}

export interface Session {
    id: string;
    title: string;
    timestamp: number;
    messages: Message[];
}

/**
 * Interface representing a generated code artifact
 */
export interface Artifact {
  id: string;
  html: string;
  styleName: string;
  status: 'streaming' | 'complete';
}
