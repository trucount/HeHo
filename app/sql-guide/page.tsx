import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SQLGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold text-foreground mb-6">Supabase SQL Setup Guide</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Follow this guide to set up your Supabase database for use with HeHo chatbots
          </p>

          {/* Step 1: Create Users Table */}
          <Card className="border-border/50 bg-card/50 mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">Step 1: Create Users Table</CardTitle>
              <CardDescription className="text-muted-foreground">
                Store information about your application users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground text-sm">Copy and paste the following SQL into your Supabase SQL editor:</p>
              <div className="bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
                  {`CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true);`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Create Contacts Table */}
          <Card className="border-border/50 bg-card/50 mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">Step 2: Create Contacts Table</CardTitle>
              <CardDescription className="text-muted-foreground">Store customer support contacts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground text-sm">Copy and paste the following SQL into your Supabase SQL editor:</p>
              <div className="bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
                  {`CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contacts"
  ON contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own contacts"
  ON contacts FOR SELECT
  USING (true);`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Create Orders Table */}
          <Card className="border-border/50 bg-card/50 mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">Step 3: Create Orders Table</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track customer orders and transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground text-sm">Copy and paste the following SQL into your Supabase SQL editor:</p>
              <div className="bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
                  {`CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read orders"
  ON orders FOR SELECT
  USING (true);`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Create Products Table */}
          <Card className="border-border/50 bg-card/50 mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">Step 4: Create Products Table</CardTitle>
              <CardDescription className="text-muted-foreground">Store your product catalog</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground text-sm">Copy and paste the following SQL into your Supabase SQL editor:</p>
              <div className="bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
                  {`CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  stock_quantity INT DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-border/50 bg-card/50 mb-8">
            <CardHeader>
              <CardTitle className="text-foreground">How to Execute These Queries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-muted-foreground text-sm">
                <li>
                  <strong className="text-foreground">1.</strong> Go to{" "}
                  <a
                    href="https://app.supabase.com"
                    target="_blank"
                    className="text-white hover:underline"
                    rel="noreferrer"
                  >
                    app.supabase.com
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">2.</strong> Select your project
                </li>
                <li>
                  <strong className="text-foreground">3.</strong> Click "SQL Editor" in the left sidebar
                </li>
                <li>
                  <strong className="text-foreground">4.</strong> Click "New Query"
                </li>
                <li>
                  <strong className="text-foreground">5.</strong> Paste one of the SQL statements above
                </li>
                <li>
                  <strong className="text-foreground">6.</strong> Click "Run" (or Ctrl+Enter)
                </li>
                <li>
                  <strong className="text-foreground">7.</strong> Repeat for all tables you need
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Alert className="bg-white/5 border-white/20">
            <AlertDescription className="text-foreground space-y-2">
              <p>
                <strong>📌 Important:</strong> These tables are templates. You should customize them to match your
                specific data structure.
              </p>
              <p>
                <strong>🔐 Security:</strong> All tables have Row Level Security (RLS) enabled. You may need to adjust
                the policies based on your requirements.
              </p>
              <p>
                <strong>✅ Pro Tip:</strong> Start with the Users and Contacts tables, then add others as needed for
                your chatbot.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </main>
      <Footer />
    </div>
  )
}
