import logging
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class UserReport:
    report_id: str
    session_id: str
    reporter_device_id: str
    reported_device_id: str
    reason: str
    description: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending, reviewed, resolved, dismissed

class ReportManager:
    def __init__(self):
        self.reports: Dict[str, UserReport] = {}
        self.reports_by_user: Dict[str, List[str]] = {}
    
    def create_report(
        self,
        report_id: str,
        session_id: str,
        reporter_device_id: str,
        reported_device_id: str,
        reason: str,
        description: Optional[str] = None
    ) -> UserReport:
        report = UserReport(
            report_id=report_id,
            session_id=session_id,
            reporter_device_id=reporter_device_id,
            reported_device_id=reported_device_id,
            reason=reason,
            description=description
        )
        
        self.reports[report_id] = report
        
        if reported_device_id not in self.reports_by_user:
            self.reports_by_user[reported_device_id] = []
        self.reports_by_user[reported_device_id].append(report_id)
        
        logger.info(f"Report created: {report_id} against {reported_device_id}")
        return report
    
    def get_report(self, report_id: str) -> Optional[UserReport]:
        return self.reports.get(report_id)
    
    def get_user_reports(self, device_id: str) -> List[UserReport]:
        report_ids = self.reports_by_user.get(device_id, [])
        return [self.reports[rid] for rid in report_ids if rid in self.reports]
    
    def get_user_report_count(self, device_id: str) -> int:
        return len(self.reports_by_user.get(device_id, []))
    
    def update_status(self, report_id: str, status: str) -> bool:
        if report_id in self.reports:
            self.reports[report_id].status = status
            return True
        return False

report_manager = ReportManager()
