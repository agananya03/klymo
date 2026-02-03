from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

def inspect_db():
    print(f"--- Inspecting PostgreSQL Database ---")
    print(f"URL: {settings.DATABASE_URL.split('@')[-1]}")
    
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    try:
        table_names = inspector.get_table_names()
        print(f"\nFound {len(table_names)} tables:")
        
        with engine.connect() as conn:
            for table in table_names:
                # Get row count
                count = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
                print(f" - {table:<15} : {count} rows")
                
                # Get columns for detail
                # columns = inspector.get_columns(table)
                # col_names = [c['name'] for c in columns]
                # print(f"   Columns: {', '.join(col_names)}")

    except Exception as e:
        print(f"Error inspecting DB: {e}")

if __name__ == "__main__":
    inspect_db()
