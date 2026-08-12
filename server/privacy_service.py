import re

class PrivacyGuard:
    def __init__(self):
        # Email: matches standard email structures
        self.email_pattern = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
        
        # Credit Card: matches 13 to 19 digit numbers, with or without spaces/dashes
        self.card_pattern = re.compile(r'\b(?:\d[ -]*?){13,19}\b')
        
        # Phone: matches typical mobile/international phone structures
        self.phone_pattern = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
        
        # UPI Handle (very common in Indian finance context): user@bank
        self.upi_pattern = re.compile(r'\b[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]{3,12}\b')

    def anonymize(self, text: str) -> tuple[str, dict]:
        if not text:
            return "", {}

        mapping = {}
        anonymized = text

        # 1. Mask Emails
        emails = self.email_pattern.findall(anonymized)
        for idx, email in enumerate(sorted(set(emails), key=len, reverse=True)):
            placeholder = f"[EMAIL_{idx+1}]"
            mapping[placeholder] = email
            anonymized = anonymized.replace(email, placeholder)

        # 2. Mask UPI handles
        upis = self.upi_pattern.findall(anonymized)
        for idx, upi in enumerate(sorted(set(upis), key=len, reverse=True)):
            # Skip if already masked inside emails
            if upi in mapping.values() or any(upi in val for val in mapping.values()):
                continue
            placeholder = f"[UPI_ID_{idx+1}]"
            mapping[placeholder] = upi
            anonymized = anonymized.replace(upi, placeholder)

        # 3. Mask Cards (keep last 4 digits for financial context)
        cards = self.card_pattern.findall(anonymized)
        for idx, card in enumerate(sorted(set(cards), key=len, reverse=True)):
            clean_card = card.replace(" ", "").replace("-", "")
            last_4 = clean_card[-4:]
            placeholder = f"[CARD_XXXX_XXXX_XXXX_{last_4}]"
            mapping[placeholder] = card
            anonymized = anonymized.replace(card, placeholder)

        # 4. Mask Phone numbers
        phones = self.phone_pattern.findall(anonymized)
        for idx, phone in enumerate(sorted(set(phones), key=len, reverse=True)):
            placeholder = f"[PHONE_{idx+1}]"
            mapping[placeholder] = phone
            anonymized = anonymized.replace(phone, placeholder)

        # 5. Mask High-Frequency Merchants / Banks
        merchants = [
            "starbucks", "netflix", "spotify", "amazon", "uber", "ola", 
            "zomato", "swiggy", "hdfc", "sbi", "icici", "paytm", "gpay", "phonepe"
        ]
        for idx, merchant in enumerate(merchants):
            pattern = re.compile(re.escape(merchant), re.IGNORECASE)
            matches = pattern.findall(anonymized)
            for match in set(matches):
                placeholder = f"[MERCHANT_{merchant.upper()}]"
                mapping[placeholder] = match
                anonymized = pattern.sub(placeholder, anonymized)

        return anonymized, mapping

    def deanonymize(self, text: str, mapping: dict) -> str:
        if not text or not mapping:
            return text

        deanon = text
        # Replace placeholders in reverse order of length to avoid substring replacement bugs
        for placeholder, original in sorted(mapping.items(), key=lambda x: len(x[0]), reverse=True):
            deanon = deanon.replace(placeholder, original)

        return deanon
