import { asyncHandler } from '../utils/asyncHandler.js';
import { exportReport, getDashboardReport, getTableReport } from '../services/report.service.js';

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboardReport(req.query);
  res.json({ success: true, data });
});

export const table = asyncHandler(async (req, res) => {
  const data = await getTableReport(req.query);
  res.json({ success: true, data });
});

export const download = asyncHandler(async (req, res) => {
  const { format } = req.params;
  const report = await exportReport(format, req.query);

  res.setHeader('Content-Type', report.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
  res.send(report.content);
});

