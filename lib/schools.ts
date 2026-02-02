export interface SchoolData {
  name: string;
  city: string;
  state: string;
  zip: string;
  district?: string;
  address?: string;
  type: "public" | "non-public";
}

let publicSchoolsCache: SchoolData[] | null = null;
let nonPublicSchoolsCache: SchoolData[] | null = null;

async function parseCSV(csvText: string, isPublic: boolean): Promise<SchoolData[]> {
  const lines = csvText.split("\n");
  const schools: SchoolData[] = [];
  
  
  const startLine = isPublic ? 4 : 3;
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    
    const fields: string[] = [];
    let currentField = "";
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim().replace(/^="|"$/g, ""));
        currentField = "";
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim().replace(/^="|"$/g, ""));
    
    if (isPublic) {
      
      if (fields.length > 15 && fields[5]) {
        schools.push({
          name: fields[5],
          city: fields[13] || "",
          state: fields[14] || "NJ",
          zip: fields[15] || "",
          district: fields[3] || "",
          address: fields[11] || "",
          type: "public",
        });
      }
    } else {
      
      if (fields.length > 9 && fields[3]) {
        schools.push({
          name: fields[3],
          city: fields[7] || "",
          state: fields[8] || "NJ",
          zip: fields[9] || "",
          address: fields[4] || "",
          type: "non-public",
        });
      }
    }
  }
  
  return schools;
}

export async function loadPublicSchools(): Promise<SchoolData[]> {
  if (publicSchoolsCache) return publicSchoolsCache;
  
  try {
    const response = await fetch("/NJPubSchool.csv");
    const text = await response.text();
    publicSchoolsCache = await parseCSV(text, true);
    return publicSchoolsCache;
  } catch (error) {
    console.error("Error loading public schools:", error);
    return [];
  }
}

export async function loadNonPublicSchools(): Promise<SchoolData[]> {
  if (nonPublicSchoolsCache) return nonPublicSchoolsCache;
  
  try {
    const response = await fetch("/NJNonPubSchools.csv");
    const text = await response.text();
    nonPublicSchoolsCache = await parseCSV(text, false);
    return nonPublicSchoolsCache;
  } catch (error) {
    console.error("Error loading non-public schools:", error);
    return [];
  }
}

export async function loadAllSchools(): Promise<SchoolData[]> {
  const [publicSchools, nonPublicSchools] = await Promise.all([
    loadPublicSchools(),
    loadNonPublicSchools(),
  ]);
  return [...publicSchools, ...nonPublicSchools];
}

export function searchSchools(schools: SchoolData[], searchTerm: string): SchoolData[] {
  if (!searchTerm.trim()) return [];
  
  const term = searchTerm.toLowerCase().trim();
  return schools.filter((school) => {
    const nameMatch = school.name.toLowerCase().includes(term);
    const cityMatch = school.city.toLowerCase().includes(term);
    const districtMatch = school.district?.toLowerCase().includes(term);
    return nameMatch || cityMatch || districtMatch;
  }).slice(0, 50); 
}
