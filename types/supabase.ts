export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
        }
        Update: {
          email?: string
        }
      }
      logs: {
        Row: {
          id: string
          type: string
          created_at: string
        }
        Insert: {
          type: string
        }
        Update: {
          type?: string
        }
      }
    }
  }
}
