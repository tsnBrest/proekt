import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { Client } from '@/types/directory';

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU');
  } catch {
    return dateString;
  }
}

export function buildTemplateData(client: Client): Record<string, string> {
  return {
    name: client.name ?? '',
    unp: client.unp ?? '',
    legal_address: client.legal_address ?? '',
    postal_address: client.postal_address ?? '',
    bank_account: client.bank_account ?? '',
    bank_name: client.bank?.name ?? '',
    bank_address: client.bank_address ?? '',
    bank_bik: client.bank_bik ?? '',
    phone: client.phone ?? '',
    email: client.email ?? '',
    director_name: client.director_name ?? '',
    director_name_genitive: client.director_name_genitive ?? '',
    director_basis: client.director_basis ?? '',
    is_ip: client.is_ip ? 'ИП' : '',
    registration_certificate: client.registration_certificate ?? '',
    registered_by: client.registered_by ?? '',
    registered_at: formatDate(client.registered_at),
    current_date: new Date().toLocaleDateString('ru-RU'),
  };
}

export function generateDocumentFromTemplate(
  templateBuffer: ArrayBuffer,
  data: Record<string, string>,
): Blob {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(data);
  const generated = doc.getZip().generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return generated as Blob;
}
