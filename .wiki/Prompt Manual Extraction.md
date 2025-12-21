# Manual Spec Extraction Prompt Template
Use this prompt when uploading a spec PDF to Claude for manual extraction.

## The Prompt
```
Please extract submittal requirements and product/manufacturer information from this construction specification PDF for Division [XX].

Follow the exact output format specified in OUTPUT_FORMAT_SPEC.md:

1. Extract all submittals categorized as:
   - 1.2 ACTION SUBMITTALS
   - 1.3 INFORMATIONAL SUBMITTALS  
   - 1.4 CLOSEOUT SUBMITTALS

2. Extract all products with manufacturer lists from PART 2 - PRODUCTS

3. Use exact formatting:
   - Lettered items: 4-space indent
   - Numbered sub-items: 8-space indent
   - Manufacturers: 12-space indent with lowercase letters
   - Section separators: 80 equals signs

4. For each section include:
   - Section number and title
   - All submittal items with proper hierarchy
   - All product categories with approved manufacturers

5. Skip specification details (things with colons like "Standard: MSS SP-110")
   - Only include actual manufacturer/company names

Please provide the output in plain text format ready to copy/paste.
```

## Example Usage
1. Upload your spec PDF to Claude
2. Copy the prompt above
3. Paste it and specify your division (e.g., "Division 22")
4. Claude will extract and format according to OUTPUT_FORMAT_SPEC.md

## What to Check in Output
- [ ] Section numbers match the spec exactly
- [ ] All submittal letters (A, B, C) are present
- [ ] Manufacturer lists don't include spec details
- [ ] Indentation is consistent (4/8/12 spaces)
- [ ] Proper spacing between sections
- [ ] No duplicate manufacturers in same list

## API Integration Later
When ready to build the API version, this same prompt will be sent programmatically to Claude API with each PDF page or section, ensuring consistent output format across all extractions.
