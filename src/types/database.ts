export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MemberRole = 'owner' | 'admin' | 'manager' | 'employee';
export type ChatType = 'general' | 'department' | 'direct' | 'project' | 'urgent' | 'announcement';
export type AvailabilityStatus = 'auto' | 'working' | 'break' | 'busy' | 'off' | 'vacation';
export type DeliveryMode = 'now' | 'next_shift';
export type NotificationType = 'message' | 'urgent_message' | 'announcement' | 'task' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          invite_code: string;
          default_work_start: string;
          default_work_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          invite_code: string;
          default_work_start?: string;
          default_work_end?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: MemberRole;
          position: string | null;
          work_start: string;
          work_end: string;
          department_id: string | null;
          availability_status: AvailabilityStatus;
          status_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: MemberRole;
          position?: string | null;
          work_start?: string;
          work_end?: string;
          department_id?: string | null;
          availability_status?: AvailabilityStatus;
          status_until?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>;
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          type: ChatType;
          created_by: string | null;
          department_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          type: ChatType;
          created_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chats']['Insert']>;
        Relationships: [];
      };
      chat_members: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chat_members']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          is_urgent: boolean;
          urgent_reason: string | null;
          delivery_mode: DeliveryMode;
          scheduled_for: string | null;
          is_delivered: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          is_urgent?: boolean;
          urgent_reason?: string | null;
          delivery_mode?: DeliveryMode;
          scheduled_for?: string | null;
          is_delivered?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
        Relationships: [];
      };
      message_acknowledgements: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          acknowledged_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          acknowledged_at?: string;
        };
        Update: Partial<Database['public']['Tables']['message_acknowledgements']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          chat_id: string | null;
          message_id: string | null;
          type: NotificationType;
          title: string;
          body: string | null;
          is_read: boolean;
          is_silent: boolean;
          scheduled_for: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          chat_id?: string | null;
          message_id?: string | null;
          type: NotificationType;
          title: string;
          body?: string | null;
          is_read?: boolean;
          is_silent?: boolean;
          scheduled_for?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type Chat = Database['public']['Tables']['chats']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type MessageAcknowledgement =
  Database['public']['Tables']['message_acknowledgements']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

export interface MemberWithProfile extends OrganizationMember {
  profile: Profile;
  department: Department | null;
}

export interface MessageWithProfile extends Message {
  sender: Profile;
  acknowledgements: MessageAcknowledgement[];
}
