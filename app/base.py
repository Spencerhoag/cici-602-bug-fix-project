import os

from supabase import create_client, Client

url: str = "https://jbsqfajyjowjclrpifqh.supabase.co"
key: str = "sb_publishable_LVc_q0RCC2E7ltnLgPMUiA_v8jW0HOW"
supabase: Client = create_client(url, key)

response = (
    supabase.table("SupabaseAPIExperiments")
    .insert({"id": 3, "fileContents": "HELLO WORLD!", "directoryName": "testDir"})
    .execute()
)