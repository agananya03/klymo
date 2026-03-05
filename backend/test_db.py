import psycopg2
import sys

def test_connection(url, name):
    print(f"Testing {name}...")
    try:
        conn = psycopg2.connect(url)
        print(f"✅ Success: {name}")
        conn.close()
    except Exception as e:
        print(f"❌ Error: {name}: {e}")

if __name__ == "__main__":
    password = "%23Ananyagarg30" # URL encoded
    raw_password = "#Ananyagarg30" # Not URL encoded
    
    # Pooler (Session mode) - uses project ref in user
    url_pooler = f"postgresql://postgres.shpjvimcmccwglgyvhjg:{password}@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
    
    # Pooler (Transaction mode - common in some setups but mostly session for python)
    url_pooler_trx = f"postgresql://postgres.shpjvimcmccwglgyvhjg:{password}@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

    # Direct connection (IPv6 only now on free tier)
    url_direct = f"postgresql://postgres:{password}@db.shpjvimcmccwglgyvhjg.supabase.co:5432/postgres"
    
    test_connection(url_pooler, "Pooler URL (port 6543)")
    test_connection(url_pooler_trx, "Pooler URL (port 5432)")
    test_connection(url_direct, "Direct URL (port 5432)")
