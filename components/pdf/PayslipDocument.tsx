import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { ToWords } from 'to-words';

const toWords = new ToWords({
  localeCode: 'en-IN',
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
  }
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', // Align Image and Text vertically
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc', 
    paddingBottom: 10, 
    marginBottom: 20}, 
    companyName: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 14, textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  
  // Grid for Employee Info
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  infoItem: { width: '50%', marginBottom: 5 },
  label: { fontWeight: 'bold', color: '#666' },
  
  // Table
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginBottom: 20 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', backgroundColor: '#f0f0f0', padding: 5 },
  tableCol: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', padding: 5 },
  
  // Split Table (Earnings vs Deductions)
  splitTable: { flexDirection: 'row', marginBottom: 0 },
  halfTable: { width: '50%' },
  
  totalRow: { flexDirection: 'row', backgroundColor: '#e0e0e0', padding: 5, marginTop: 5 },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#888' }
});

export const PayslipDocument = ({ data }: { data: any }) => {
  const monthName = new Date(0, data.month - 1).toLocaleString('default', { month: 'long' });
  const gross = Number(data.grossSalary);
  const totalDed = Number(data.totalDeductions);
  const net = Number(data.netSalary);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          {/* Logo: Use company logo if available, else default */}
          <Image 
            src={data.employee?.company?.logoUrl || "/Gigatech-logo.png"} 
            style={{ width: 60, height: 60, marginRight: 15 }}
          />
          <View>
            {/* Company Name */}
            <Text style={styles.companyName}>
              {data.employee?.company?.name || "Gigatech Global Services Pvt Ltd"}
            </Text>
            
            {/* Address */}
            <Text>
              {data.employee?.company?.address || "Sector 1, RAM SVR,Huda Techno Enclave, Hi-Tech City, Madhapur, Hyd - 500 081"}
            </Text>
            
            {/* GST (Optional) */}
            {data.employee?.company?.gstIn && (
              <Text>GSTIN: {data.employee.company.gstIn}</Text>
            )}
          </View>
        </View>

        <Text style={styles.title}>PAYSLIP FOR {monthName.toUpperCase()} {data.year}</Text>

        {/* Employee Details */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}><Text><Text style={styles.label}>Name: </Text>{data.employee.firstName} {data.employee.lastName}</Text></View>
          <View style={styles.infoItem}><Text><Text style={styles.label}>Emp Code: </Text>{data.employee.employeeCode}</Text></View>
          <View style={styles.infoItem}><Text><Text style={styles.label}>Designation: </Text>{data.employee.designation}</Text></View>
          <View style={styles.infoItem}><Text><Text style={styles.label}>Department: </Text>{data.employee.department}</Text></View>
          <View style={styles.infoItem}><Text><Text style={styles.label}>Date of Joining: </Text>{data.employee.dateOfJoining ? new Date(data.employee.dateOfJoining).toLocaleDateString() : 'N/A'}</Text></View>
          <View style={styles.infoItem}><Text><Text style={styles.label}>PAN: </Text>{data.employee.panNumber || 'N/A'}</Text></View>
        </View>

        {/* Salary Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={{fontWeight:'bold'}}>EARNINGS</Text></View>
            <View style={styles.tableColHeader}><Text style={{fontWeight:'bold'}}>DEDUCTIONS</Text></View>
          </View>
          
          <View style={styles.splitTable}>
            {/* Earnings Col */}
            <View style={styles.halfTable}>
               <Row label="Basic Salary" value={data.basicSalary} />
               <Row label="HRA" value={data.hra || "0"} />
               <Row label="DA" value={data.da || "0"} />
               <Row label="Special Allowance" value={data.specialAllowance || "0"} />
               <Row label="Bonus / Arrears" value={data.otherAllowances} />
            </View>
            {/* Deductions Col */}
            <View style={styles.halfTable}>
               <Row label="PF" value={data.pf || "0"} />
               <Row label="Professional Tax" value={data.professionalTax || "0"} />
               <Row label="ESI" value={data.esi || "0"} />
               <Row label="LOP Days" value={data.lopDays} isCurrency={false} />
               <Row label="Other Deductions" value={data.otherDeductions} />
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.table}>
           <View style={styles.tableRow}>
              <View style={styles.tableCol}><Text>Total Earnings: Rs. {gross.toFixed(2)}</Text></View>
              <View style={styles.tableCol}><Text>Total Deductions: Rs. {totalDed.toFixed(2)}</Text></View>
           </View>
        </View>

        <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f0f0', borderWidth: 1 }}>
           <Text style={{ fontSize: 12, fontWeight: 'bold' }}>NET PAY: Rs. {net.toFixed(2)}</Text>
           <Text style={{ marginTop: 5 }}>{toWords.convert(net)}</Text>
        </View>

        <Text style={styles.footer}>This is a computer-generated document. No signature required.</Text>

      </Page>
    </Document>
  );
};

const Row = ({ label, value, isCurrency = true }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 5 }}>
    <Text>{label}</Text>
    <Text>{isCurrency ? Number(value).toFixed(2) : value}</Text>
  </View>
);

// Placeholder for converting number to words (You can use a library 'number-to-words' later)
function numberToWords(amount: number) {
  return "Rupees ..."; 
}
